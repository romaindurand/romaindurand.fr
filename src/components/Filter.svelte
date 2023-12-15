<script lang="ts">
  export let active: boolean
  export let name: string
  // export let icon
</script>

<button class="Filter" class:active on:click>
{name}
</button>

<style>
  .Filter {
    background-color: hsl(340, 40%, 70%);
    transition: all .5s ease;
  }
  .active {
    background-color: hsl(340, 70%, 60%);
  }
</style>