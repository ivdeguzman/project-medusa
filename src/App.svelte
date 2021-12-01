<script>
	import Sidebar from "./components/Sidebar.svelte";
	import Header from "./components/Header.svelte";
	import SideMenu from "./components/SideMenu.svelte";
	import AddButton from "./components/AddButton.svelte";
	import Navigation from "./components/Navigation.svelte";
	import LoadingScreen from "./components/LoadingScreen.svelte";
	import SubWindow from "./components/SubWindow.svelte";
	import Student from "./routes/Student.svelte";
	import Employee from "./routes/Employee.svelte";
	import Profile from "./routes/Profile.svelte";
	import { pageIndex } from "./stores/pages";
	import { addToggle, sidebar, loadingComplete } from "./stores/ui";
	import { selectedProfile } from "./stores/profile";
</script>

<LoadingScreen />
{#if $loadingComplete}
	{#if $addToggle == true}
		<SubWindow />
	{/if}
	{#if $sidebar}
		<SideMenu />
	{/if}
	<AddButton />
	<Navigation />
	<main class="grid w-screen h-screen">
		<Sidebar />
		<div class="h-screen grid body">
			<Header />
			<section class="overflow-x-hidden w-full h-full overflow-scroll">
				{#if $selectedProfile != ""}
					<Profile />
				{:else if $pageIndex == 0}
					<Student />
				{:else if $pageIndex == 1}
					<Employee />
				{/if}
			</section>
		</div>
	</main>
{/if}

<style>
	main {
		grid-template-columns: auto 1fr;
	}
	div.body {
		grid-template-rows: auto 1fr;
	}
</style>