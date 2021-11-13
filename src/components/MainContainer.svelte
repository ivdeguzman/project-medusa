<script>
  import StudentsContainer from "./containers/StudentsContainer.svelte";
  import EmployeesContainer from "./containers/EmployeesContainer.svelte";
  import LogbookContainer from "./containers/LogbookContainer.svelte";
  import SelectedProfileContainer from "./containers/SelectedProfileContainer.svelte";
  import SearchBar from "./interface/SearchBar.svelte";
  export let tabIndex, selectedProfile;
  let searchValue = "";
</script>

<div class="wrapper">
  {#if selectedProfile == null}
    {#if tabIndex === 0 || tabIndex === 1}
      <SearchBar bind:searchValue />
    {/if}
    {#if tabIndex === 0 || tabIndex === 1}
      <div class="body">
        {#if tabIndex === 0}
          <StudentsContainer bind:searchValue bind:selectedProfile />
        {:else if tabIndex === 1}
          <EmployeesContainer bind:searchValue bind:selectedProfile />
        {/if}
      </div>
    {:else}
      <LogbookContainer />
    {/if}
  {:else}
    <SelectedProfileContainer {tabIndex} bind:selectedProfile />
  {/if}
</div>

<style>
  .wrapper {
    width: 100vw;
		height: 100%;
    overflow: scroll;
    overflow-x: hidden;
    display: flex;
    flex-flow: column nowrap;
  }
  .body {
    margin: 32px 75px;
  }
</style>