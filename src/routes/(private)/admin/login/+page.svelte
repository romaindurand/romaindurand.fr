<script>
	import { enhance } from '$app/forms';
</script>

<form method="post" use:enhance>
	<!-- svelte-ignore a11y_autofocus -->
	<input type="password" name="key" autofocus />
	<button type="submit">Login</button>
</form>
