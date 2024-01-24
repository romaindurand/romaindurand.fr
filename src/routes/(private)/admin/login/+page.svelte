<script>
	import { enhance } from '$app/forms';
</script>

<form method="post" use:enhance>
	<input type="text" name="key" />
	<button type="submit">Login</button>
</form>
