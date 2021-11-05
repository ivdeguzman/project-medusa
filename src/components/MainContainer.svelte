<script>
  import StudentsContainer from "./containers/StudentsContainer.svelte";
  import EmployeesContainer from "./containers/EmployeesContainer.svelte";
  import LogbookContainer from "./containers/LogbookContainer.svelte";
  import SearchBar from "./interface/SearchBar.svelte";
  export let tabIndex;
  let searchValue = "";
</script>

<div class="wrapper">
  {#if tabIndex === 0 || tabIndex === 1}
    <SearchBar bind:searchValue />
  {/if}
  {#if tabIndex === 0}
    <div class="body">
      <StudentsContainer bind:searchValue />
    </div>
  {:else if tabIndex === 1}
    <div class="body">
      <EmployeesContainer bind:searchValue />
    </div>
  {:else}
    <LogbookContainer />
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