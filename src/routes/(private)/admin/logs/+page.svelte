<script lang="ts">
	let { data } = $props();

	let logs = $state(data.logs);
	let filteredLogs = $derived(logs);
	let startDate = $derived(logs.at(0)?.timestamp);
	let endDate = $derived(logs.at(-1)?.timestamp);

	function filterLogs() {}
</script>
