<script>
	import TitleBar from './components/TitleBar.svelte';
	import MainContainer from './components/MainContainer.svelte';
	import AddButton from './components/interface/AddButton.svelte';
	import AddScreen from './components/AddScreen.svelte';
	import LoadingScreen from './components/LoadingScreen.svelte'
	let tabIndex = 0;
	let addPressed = true;
	let doneLoading = true;
</script>

{#if !doneLoading}
	<LoadingScreen bind:doneLoading />
{:else}
	{#if addPressed}
		<AddScreen bind:addPressed {tabIndex} />
	{/if}
	<main class:blur="{addPressed}">
		<TitleBar bind:tabIndex />
		<MainContainer {tabIndex} />
		{#if tabIndex != 2}
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
	.blur {
		transition: filter ease-in-out 200ms;
		filter: blur(2.5px);
	} 
</style>