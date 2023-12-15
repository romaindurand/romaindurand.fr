<script lang="ts">
  import './PostBody.css'

  import showdown from 'showdown'
  import showdownHighlight from 'showdown-highlight'

  export let markdown: string = ""

  const converter = new showdown.Converter({
    extensions: [showdownHighlight({
      auto_detection: true,
    })]
  })

  $: html = converter.makeHtml(markdown)
</script>

<div class="PostBody">
  {@html html}
</div>
