---
# GFM Disallowed Raw HTML (extension): the tags title, textarea, style, xmp,
# iframe, noembed, noframes, script and plaintext are filtered when rendering
# HTML output by replacing the leading `<` with `&lt;`. Tag names match
# case-insensitively; longer names like `<titlex>` are not filtered.
# See GFM spec example 657.
---
<strong> <title> <style> <em>

<blockquote>
  <xmp> is disallowed.  <XMP> is also disallowed.
</blockquote>

<div>
<script type="text/javascript">
alert('hi');
</script>
</div>

</title> <textarea> <iframe src="x"></iframe>

<titlex> <title-foo> <span>not filtered</span>
