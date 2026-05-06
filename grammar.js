/**
 * @file Used for live calculations in neovim.
 * @author Franco Morroni <fmorroni99@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: 'livecalc',
  precedences: ($) => [['call', 'unary_void', 'binary_exp', 'binary_times', 'unit', 'binary_plus']],

  extras: ($) => [
    /[ \t\r]/, // whitespace
    $.comment,
  ],

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
      choice($.binary_expression, $.unary_expression, $.postfix_expression, $.primary_expression),

    primary_expression: ($) => choice($.identifier, $.number, $.parenthesized_expression),

    postfix_expression: ($) => prec.left('unit', seq($.expression, $.units)),

    unary_expression: ($) =>
      prec.left(
        'unary_void',
        seq(field('operator', choice('-', '+')), field('argument', $.expression))
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ['+', 'binary_plus'],
          ['-', 'binary_plus'],
          ['*', 'binary_times'],
          ['/', 'binary_times'],
          ['%', 'binary_times'],
          ['**', 'binary_exp', 'right'],
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
    unit_binary_expression: ($) =>
      choice(
        ...[
          ['+', 'binary_plus'],
          ['-', 'binary_plus'],
          ['*', 'binary_times'],
          ['/', 'binary_times'],
          ['**', 'binary_exp', 'right'],
        ].map(([operator, precedence, associativity]) =>
          (associativity === 'right' ? prec.right : prec.left)(
            precedence,
            seq(
              field('left', $.unit_expression),
              field('operator', operator),
              field('right', $.unit_expression)
            )
          )
        )
      ),

    unit_parenthesized_expression: ($) => seq('(', $.unit_expression, ')'),
    unit_expression: ($) =>
      choice($.identifier, $.unit_binary_expression, $.unit_parenthesized_expression),
    units: ($) => seq('[', $.unit_expression, ']'),

    identifier: () => /[a-z]+/,
    number: () => /\d+/,
    _newline: () => /\n/,

    comment: () => token(seq('--', /.*/)),
  },
});
