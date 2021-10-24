<script>
  import StudentsContainer from "./Containers/StudentsContainer.svelte";
  import InstructorsContainer from "./Containers/InstructorsContainer.svelte";
  import LogbookContainer from "./Containers/LogbookContainer.svelte";
  import SearchBar from "../components/inferace/SearchBar.svelte";
  export let tabIndex;
  let searchValue = "";
</script>

<div class="wrapper">
  {#if tabIndex === 0 || tabIndex === 1}
    <SearchBar bind:searchValue />
  {/if}
  {#if tabIndex === 0}
    <div class="body">
      <StudentsContainer {searchValue} />
    </div>
  {:else if tabIndex === 1}
    <div class="body">
      <InstructorsContainer {searchValue} />
    </div>
  {:else}
    <LogbookContainer />
  {/if}
</div>

<style>
  .wrapper {
    width: 100vw;
		height: 100%;
    overflow: auto;
    display: flex;
    flex-flow: column nowrap;
  }
  .body {
    margin-top: 40px;
  }
</style>