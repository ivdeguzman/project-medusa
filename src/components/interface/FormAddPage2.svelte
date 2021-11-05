<script>
  export let tabIndex;
  export let UserData;
</script>

<div class="container">
  {#if tabIndex == 0}
    <h1>The name of the student is...</h1>
  {:else if tabIndex == 1}
    <h1>The name of the employee is...</h1>
  {/if}
  <div class="form">
    <input bind:value={UserData.Name.First} type="text" name="first-name" id="first-name" placeholder="Enter first name" />
    <input bind:value={UserData.Name.Last} type="text" name="last-name" id="last-name" placeholder="Enter last name" />
  </div>
</div>

<style>
  div.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
  div.form {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    width: 350px;
  }
  input {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    border: none;
    height: 32px;
    width: 100%;
    background: #efefef;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    border-radius: 50px;
    font-size: 15px;
    text-align: center;
    margin-top: 10px;
  }
  h1 {
    margin: 5px;
    font-size: 27.5px;
    font-weight: 350;
    text-align: center;
  }
</style>