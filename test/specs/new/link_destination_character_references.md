---
# Character references resolve in a link destination but not in an autolink, so
# the same query string has to be escaped differently depending on where it is
# written. `&lt;` in an inline, reference or image destination resolves to `<`
# and is percent-encoded (`?x=1%3C2`), matching CommonMark (examples 32, 33,
# 503); in an autolink the `&` stays literal.
renderExact: true
---
https://example.com/?x=1&lt;2

https://example.com/?y=1&amp;2

https://example.com/?a=1&b=2

<https://example.com/?x=1&lt;2>

<https://example.com/?y=1&amp;2>

<https://example.com/?a=1&b=2>

[https://example.com/?x=1&lt;2](https://example.com/?x=1&lt;2)

[https://example.com/?y=1&amp;2](https://example.com/?y=1&amp;2)

[https://example.com/?a=1&b=2](https://example.com/?a=1&b=2)

[https://example.com/?x=1&lt;2][link1]

[https://example.com/?y=1&amp;2][link2]

[https://example.com/?a=1&b=2][link3]

![https://example.com/?x=1&lt;2](https://example.com/?x=1&lt;2)

![https://example.com/?y=1&amp;2](https://example.com/?y=1&amp;2)

![https://example.com/?a=1&b=2](https://example.com/?a=1&b=2)

[link1]: https://example.com/?x=1&lt;2
[link2]: https://example.com/?y=1&amp;2
[link3]: https://example.com/?a=1&b=2
