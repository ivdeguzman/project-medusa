<script>
	import TitleBar from './components/TitleBar.svelte';
	import MainContainer from './components/MainContainer.svelte';
	import AddButton from './components/inferace/AddButton.svelte';
	let tabIndex = 0;
</script>

<main>
	<TitleBar bind:tabIndex />
	<MainContainer {tabIndex} />
	<AddButton />
</main>

<style>
	main {
		width: 100vw;
		height: 100vh;
		background-color: #efefef;
		display: grid;
		grid-template-rows: auto 1fr;
	}
</style>