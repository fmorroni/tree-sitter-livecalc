; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "**"
  "="
] @operator

; Variables
(identifier) @variable

(unit_expression/identifier) @type

; Literals
(number) @number

[
  "("
  ")"
  "["
  "]"
] @punctuation.bracket

; Others
(comment) @comment
