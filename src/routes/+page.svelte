<script lang="ts">
	import PostBody from './../components/PostBody.svelte';
	import Filter from './../components/Filter.svelte';
	import { onMount } from "svelte";
	import { getSlug } from '$lib';

  export let data;

  $: posts = data.posts

  let filters = [
    { name: "category1", active: true },
    { name: "category2", active: true },
    { name: "category3", active: true }]

  onMount(() => {
    const storedFilters = localStorage.getItem("filters")
    // TODO : if names doesn't match, reset filters
    console.log({storedFilters})
    if (storedFilters) {
      filters = JSON.parse(storedFilters)
    }
  })
</script>

{#each filters as { name, active }, i (i)}
  <Filter {name} {active} on:click={() => {
    filters[i].active = !filters[i].active
    localStorage.setItem("filters", JSON.stringify(filters))
  }} />
{/each}

{#each posts as post}
  <div class="post">
    <a href="post/{getSlug(post)}">{post.title}</a>

    {#if post.content}
       <PostBody markdown={post.content} />
    {/if}
  </div>
{/each}