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

([
   (unit_expression/identifier)
   (boolean_type)
   (numeric_type)
   (any_type)
   (function_type)
]) @type

(builtin
  "@" @function.builtin
  (identifier) @function.builtin)

(boolean) @boolean

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
