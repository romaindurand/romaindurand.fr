<script lang="ts">
  import showdown from 'showdown'

  export let markdown: string = ""

  const converter = new showdown.Converter()

  $: html = converter.makeHtml(markdown)
</script>

<div class="PostBody">
  {@html html}
</div>