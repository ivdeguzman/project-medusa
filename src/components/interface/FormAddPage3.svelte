<script>
  export let tabIndex, UserData, incomplete;
  $: if (tabIndex == 0 && UserData.Student.Course != "" && UserData.Student.Year != "" && UserData.Student.Section != "") {
    incomplete = false;
  } else if (tabIndex == 1 && UserData.Occupation != "") {
    incomplete = false;
  } else {
    incomplete = true;
  }
</script>

<div class="container">
  {#if tabIndex == 0}
    <h1>This student belongs to...</h1>
  {:else if tabIndex == 1}
    <h1>This lovely employee is...</h1>
  {/if}
  <div class="form">
    {#if tabIndex == 0}
      <input class="first" bind:value={UserData.Student.Course} type="text" name="student-course" id="student-course" placeholder="Enter student course" />
      <div class="sub-form">  
        <input bind:value={UserData.Student.Year} type="tel" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');" name="student-year" id="student-year" placeholder="Year" />
        <input bind:value={UserData.Student.Section} type="tel" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');" name="student-section" id="student-section" placeholder="Section" />
      </div>
    {:else if tabIndex == 1}
      <input class="first" bind:value={UserData.Occupation} type="text" name="occupation" id="occupation" placeholder="Enter employee occupation" />
    {/if}
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
    height: 32px;
    width: 100%;
    border: none;
    margin-top: 10px;
    text-align: center;
    background: #efefef;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    border-radius: 50px;
    font-size: 15px;
    font-family: inherit;
  }
  div.sub-form {
    display: flex;
    flex-flow: row nowrap;
  }
  div.sub-form input:first-child {
    margin-right: 15px;
  }
  h1 {
    margin: 5px;
    font-size: 27.5px;
    font-weight: 350;
    text-align: center;
  }
</style>