<script>
	import TitleBar from './components/TitleBar.svelte';
	import MainContainer from './components/MainContainer.svelte';
	import AddButton from './components/interface/AddButton.svelte';
	import AddScreen from './components/AddScreen.svelte';
	import LoadingScreen from './components/LoadingScreen.svelte'
	let tabIndex = 0;
	let addPressed = false;
	let doneLoading = true;
	let selectedProfile = null;
</script>

{#if !doneLoading}
	<LoadingScreen bind:doneLoading />
{:else}
	{#if addPressed}
		<AddScreen bind:addPressed {tabIndex} />
	{/if}
	<main>
		<TitleBar bind:tabIndex bind:selectedProfile />
		<MainContainer {tabIndex} bind:selectedProfile />
		{#if tabIndex != 2 && selectedProfile == null}
			<AddButton bind:addPressed />
		{/if}
	</main>
{/if}

<style>
	main {
		width: 100vw;
		height: 100vh;
		background-color: #efefef;
		display: grid;
		grid-template-rows: auto 1fr;
		transition: filter ease-in-out 200ms;
	}
</style>