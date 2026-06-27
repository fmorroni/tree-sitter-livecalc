/**
 * @file Used for live calculations in neovim.
 * @author Franco Morroni <fmorroni99@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// TODO:
// - allow "unit included" for unit typed parameters. Will have to define notation,
//   maybe using curly braces like `param: {s/m**2}` to symbolize `param` must include
//   `s` with exponent 1 and `m` with exponent `-2` but could include any other units.
//   Would be useful for things like `s_to_ns = (s: {s}) => s * 1000000000 [ns/s]` which
//   could allow `s_to_ns(1 [s/tick])` but not `s_to_ns(1 [m])`.
// - bit-wise operators.
// - allow `or` in parameter types like `(p: [s]|[m]) => ...`.
// - allow generics for units maybe something like `(a: <T>, b: <T>, c: <E>) => (a+b)*c` --> `([T], [T], [E]) => [E T]`

export default grammar({
  name: 'livecalc',
  precedences: ($) => [
    [
      'call',
      'unary_void',
      'binary_pow',
      'unit',
      'binary_times',
      'binary_plus',
      'comparison',
      'boolean_and',
      'boolean_or',
      $.function,
    ],
  ],

  conflicts: ($) => [[$.expression, $.parameter]],

  extras: ($) => [
    /[ \t\r]/, // whitespace
    $.comment,
  ],

  supertypes: ($) => [$.expression, $.unit_expression],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat(seq(optional($._statement), $._newline)),

    // From `https://github.com/tree-sitter/tree-sitter-javascript/blob/58404d8cf191d69f2674a8fd507bd5776f46cb11/grammar.js#L1143`
    identifier: () => {
      const alpha =
        //@ts-ignore
        /[^\x00-\x1F\s\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/;

      const alphanumeric =
        //@ts-ignore
        /[^\x00-\x1F\s\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/;
      return token(seq(alpha, repeat(alphanumeric)));
    },

    number: ($) =>
      choice(
        $.numeric_integer,
        $.numeric_float,
        $.numeric_exponential,
        $.numeric_hexadecimal,
        $.numeric_binary
      ),
    numeric_integer: () => /\d+/,
    numeric_float: () => /\d*\.\d+/,
    numeric_exponential: () => /\d*\.?\d+e[+-]?\d+/,
    numeric_hexadecimal: () => /0[xX][0-9a-fA-F]+/,
    numeric_binary: () => /0[bB][0-1]+/,
    boolean: () => choice('true', 'false'),

    _newline: () => /\n/,
    comment: () => token(seq('//', /.*/)),

    _statement: ($) => choice($.assignment, $.expression),

    assignment: ($) => seq(field('left', $.identifier), '=', field('right', $.expression)),

    parenthesized_expression: ($) => seq('(', $.expression, ')'),

    expression: ($) =>
      choice(
        $.identifier,
        $.number,
        $.boolean,
        $.builtin,
        $.function,
        $.function_call,
        $.binary_numeric_expression,
        $.binary_boolean_expression,
        $.unary_expression,
        $.expression_with_units,
        $.parenthesized_expression
      ),

    expression_with_units: ($) =>
      prec.left('unit', seq(field('expr', $.expression), field('units', $.units))),

    unary_expression: ($) =>
      prec.left(
        'unary_void',
        seq(field('operator', choice('-', '+', '!')), field('expr', $.expression))
      ),

    binary_numeric_expression: ($) =>
      choice(
        ...[
          ['+', 'binary_plus'],
          ['-', 'binary_plus'],
          ['*', 'binary_times'],
          ['/', 'binary_times'],
          ['%', 'binary_times'],
          ['**', 'binary_pow', 'right'],
        ].map(([operator, precedence, associativity]) =>
          (associativity === 'right' ? prec.right : prec.left)(
            precedence,
            seq(
              field('left', $.expression),
              field('operator', operator),
              field('right', $.expression)
            )
          )
        )
      ),

    binary_boolean_expression: ($) =>
      choice(
        ...[
          ['||', 'boolean_or'],
          ['&&', 'boolean_and'],
          ['==', 'comparison'],
          ['!=', 'comparison'],
          ['<', 'comparison'],
          ['<=', 'comparison'],
          ['>', 'comparison'],
          ['>=', 'comparison'],
        ].map(([operator, precedence, associativity]) =>
          (associativity === 'right' ? prec.right : prec.left)(
            precedence,
            seq(
              field('left', $.expression),
              field('operator', operator),
              field('right', $.expression)
            )
          )
        )
      ),

    unit_times_expression: ($) =>
      prec.left(
        'binary_times',
        seq(
          field('left', $.unit_expression),
          field('operator', choice('*', '/')),
          field('right', $.unit_expression)
        )
      ),

    unit_inverse: ($) =>
      prec.left('binary_times', seq('1', '/', field('denominator', $.unit_expression))),

    unit_unary_expression: ($) =>
      prec.left('unary_void', seq(field('operator', choice('-', '+')), field('expr', $.number))),

    unit_pow_expression: ($) =>
      prec.right(
        'binary_pow',
        seq(
          field('base', $.unit_expression),
          '**',
          field('exponent', choice($.number, $.unit_unary_expression))
        )
      ),

    unit_parenthesized_expression: ($) => seq('(', $.unit_expression, ')'),

    unit_expression: ($) =>
      choice(
        $.identifier,
        $.unit_times_expression,
        $.unit_inverse,
        $.unit_pow_expression,
        $.unit_parenthesized_expression
      ),

    units: ($) => seq('[', optional($.unit_expression), ']'),

    builtin: ($) => seq('@', $.identifier),

    function_call: ($) =>
      prec(
        'call',
        seq(
          field('callee', choice($.expression)),
          '(',
          field('args', optional($.argument_list)),
          ')'
        )
      ),

    argument_list: ($) => separatedList($.expression, ','),

    function: ($) =>
      seq('(', field('params', optional($.parameter_list)), ')', '=>', field('body', $.expression)),

    parameter_list: ($) => separatedList($.parameter, ','),

    boolean_type: () => 'boolean',

    numeric_type: () => 'numeric',

    type_list: ($) => separatedList($._parameter_type, ','),
    function_type: ($) =>
      seq(
        '(',
        field('param_types', optional($.type_list)),
        ')',
        '=>',
        field('return_type', $._parameter_type)
      ),

    any_type: () => 'any',

    _parameter_type: ($) =>
      choice($.units, $.boolean_type, $.numeric_type, $.function_type, $.any_type),

    parameter: ($) =>
      seq(field('name', $.identifier), optional(seq(':', field('type', $._parameter_type)))),
  },
});

/**
 * @param {Rule} rule
 * @param {string} separator
 */
function separatedList(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
