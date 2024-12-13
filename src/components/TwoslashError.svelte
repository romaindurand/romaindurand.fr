<script lang="ts">
	type Props = {
		title: string;
		recommendation: string;
		description: string;
	};
	let { title, recommendation, description }: Props = $props();
</script>

<div>
	<em>{title}</em>
	<pre>{@html recommendation}<br /><br />{@html description}</pre>
</div>

<style>
	div {
		margin: 1rem 0;
		padding: 1rem;
		border: 5px solid red;
		border-radius: 5px;
	}
</style>
