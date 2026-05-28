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

(builtin
  "@" @function.builtin
  (identifier) @function.builtin)

(function_call
  (identifier) @function.call)

(assignment
  left: (identifier) @function
  right: (function))

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
