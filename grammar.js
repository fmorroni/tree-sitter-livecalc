/**
 * @file Used for live calculations in neovim.
 * @author Franco Morroni <fmorroni99@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: 'livecalc',
  precedences: ($) => [['call', 'unary_void', 'binary_pow', 'unit', 'binary_times', 'binary_plus']],

  extras: ($) => [
    /[ \t\r]/, // whitespace
    $.comment,
  ],

  supertypes: ($) => [$.expression, $.unit_expression],

  rules: {
    source_file: ($) => repeat(seq(optional($._statement), $._newline)),

    // function_definition: ($) =>
    //   seq("func", $.identifier, $.parameter_list, $._type, $.block),
    //
    // parameter_list: ($) =>
    //   seq(
    //     "(",
    //     // TODO: parameters
    //     ")",
    //   ),
    //
    // _type: ($) =>
    //   choice(
    //     "bool",
    //     // TODO: other kinds of types
    //   ),
    //
    // block: ($) => seq("{", repeat($._statement), "}"),
    // return_statement: ($) => seq("return", $.expression, ";"),

    _statement: ($) =>
      choice(
        // $.return_statement,
        $.assignment,
        $.expression
        // TODO: other kinds of statements
      ),

    assignment: ($) => seq(field('left', $.identifier), '=', field('right', $.expression)),

    parenthesized_expression: ($) => seq('(', $.expression, ')'),

    expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.expression_with_units,
        $.identifier,
        $.number,
        $.parenthesized_expression
      ),

    expression_with_units: ($) =>
      prec.left('unit', seq(field('expr', $.expression), field('units', $.units))),

    unary_expression: ($) =>
      prec.left(
        'unary_void',
        seq(field('operator', choice('-', '+')), field('expr', $.expression))
      ),

    binary_expression: ($) =>
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

    units: ($) => seq('[', $.unit_expression, ']'),

    identifier: () => /[a-z]+/,

    number: ($) => choice($._integer, $._float),
    _integer: () => /\d+/,
    _float: () => /\d*\.\d+/,

    _newline: () => /\n/,
    comment: () => token(seq('//', /.*/)),
  },
});
