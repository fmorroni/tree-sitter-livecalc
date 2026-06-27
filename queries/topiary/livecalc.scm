(comment) @leaf

[
  (statement)
  (comment)
] @allow_blank_line_before

(
  [(statement) (comment)] @append_hardline
  .
  (_)
)

[
  "="
  "+"
  "-"
  "*"
  "/"
  "%"
  "**"
  "||"
  "&&"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "=>"
] @prepend_space @append_space

(unit_times_expression
  operator: _ @prepend_antispace @append_antispace
)

(unit_inverse
  operator: _ @prepend_antispace @append_antispace
)

(unit_unary_expression
  operator: _ @prepend_antispace @append_antispace
)

(unit_pow_expression
  operator: _ @prepend_antispace @append_antispace
)

(parameter
  type: (_) @prepend_space
)

(expression_with_units
  units: (_) @prepend_space
)

(parameter_list "," @append_space)

(argument_list "," @append_space)

(type_list "," @append_space)
