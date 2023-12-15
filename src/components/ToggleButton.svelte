<script>
  export let isChecked = false;

  function toggle() {
    isChecked = !isChecked;
  }
</script>

<label class="toggle-button">
  <input type="checkbox" bind:checked={isChecked} class="hidden-checkbox" />
  <button class="toggle-slider" on:click|preventDefault={toggle}></button>
</label>

<style>
  .toggle-button {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 30px;
  }

  .hidden-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #ccc;
    border-radius: 15px;
    transition: 0.4s;
    border: none;
  }

  .toggle-slider:before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 26px;
    height: 26px;
    background-color: white;
    border-radius: 50%;
    transition: 0.4s;
  }

  .hidden-checkbox:checked + .toggle-slider {
    background-color: #2196f3;
  }

  .hidden-checkbox:checked + .toggle-slider:before {
    transform: translateX(30px);
  }
</style>
