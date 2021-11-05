<script>
  export let tabIndex;
</script>

<div class="container">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  {#if tabIndex == 0}
    <h1>Add a student.</h1>
  {:else if tabIndex == 1}
    <h1>Add an employee.</h1>
  {/if}
</div>

<style>
  div.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
  }
  svg {
    width: 75px;
    height: 75px;
    stroke-width: 1px;
    border-radius: 100%;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    stroke: #efefef;
    background-color: #63b9db;
  }
  h1 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    margin: 5px;
    font-size: 27.5px;
    font-weight: 350;
    text-align: center;
  }
</style>