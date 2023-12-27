<script>
	import { enhance } from '$app/forms';
</script>

<form
	method="post"
	use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		console.log('form submitted');
		// TODO: handle form response client-side
		// `formElement` is this `<form>` element
		// `formData` is its `FormData` object that's about to be submitted
		// `action` is the URL to which the form is posted
		// calling `cancel()` will prevent the submission
		// `submitter` is the `HTMLElement` that caused the form to be submitted

		return async ({ result, update }) => {
			// `result` is an `ActionResult` object
			// `update` is a function which triggers the default logic that would be triggered if this callback wasn't set
			console.log('form result', result);
			update();
		};
	}}
>
	<input type="text" name="key" />
	<button type="submit">Login</button>
</form>
