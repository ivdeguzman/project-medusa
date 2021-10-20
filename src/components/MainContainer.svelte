<script>
  import StudentsContainer from "./Containers/StudentsContainer.svelte";
  import InstructorsContainer from "./Containers/InstructorsContainer.svelte";
  import LogbookContainer from "./Containers/LogbookContainer.svelte";
  import SearchBar from "../components/inferace/SearchBar.svelte";
  export let tabIndex;
  let searchValue = "";
</script>

<div>
  {#if tabIndex === 0 || tabIndex === 1}
    <SearchBar bind:searchValue />
  {/if}
  {#if tabIndex === 0}
    <StudentsContainer {searchValue} />
  {:else if tabIndex === 1}
    <InstructorsContainer {searchValue} />
  {:else}
    <LogbookContainer />
  {/if}
</div>

<style>
  div {
    width: 100vw;
		height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: auto;
  }
</style>