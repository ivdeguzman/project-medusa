<script>
	import TitleBar from './components/TitleBar.svelte';
	import MainContainer from './components/MainContainer.svelte';
	import AddButton from './components/inferace/AddButton.svelte';
	import AddScreen from './components/AddScreen.svelte';
	import LoadingScreen from './components/LoadingScreen.svelte'
	let tabIndex = 0;
	let addPressed = false;
	let doneLoading = true;
</script>

{#if !doneLoading}
	<LoadingScreen bind:doneLoading />
{:else}
	{#if addPressed}
		<AddScreen bind:addPressed />
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
	}
	.blur {
		filter: blur(2.5px);
	} 
</style>