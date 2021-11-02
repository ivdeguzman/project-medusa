<script>
  import { fly, fade } from 'svelte/transition';
  export let Student;
</script>

<div class="card" in:fly={{ delay: 200, y: -50, duration: 250 }} out:fade={{ duration: 200 }}>
  <div class="status" class:check={Student.LoggedIn} class:cross={!Student.LoggedIn}>
    {#if Student.LoggedIn}
      <svg xmlns="http://www.w3.org/2000/svg" class="check" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>  
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" class="cross" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    {/if}
  </div>
  <div class="details">
    <p>{Student.Name.First} {Student.Name.Last}</p>
    <p>{Student.Student.Course} {Student.Student.Year}-{Student.Student.Section}</p>
  </div>
  <button on:click={console.log(Student.Name)}>
    <svg xmlns="http://www.w3.org/2000/svg" class="carat" class:check={Student.LoggedIn} class:cross={!Student.LoggedIn} fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>

<style>
  div.card {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 15px;
    width: 700px;
    height: 70px;
    border-radius: 10px;
    margin: 7.5px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
  }
  div.status {
    display: grid;
    place-items: center;
    border-radius: 10px 0 0 10px;
    width: 125px;
    height: 100%;
  }
  div.check {
    transition: background-color 150ms ease-in-out;
    background-color: #63b9db;
  }
  div.cross {
    transition: background-color 150ms ease-in-out;
    background-color: #E6C2BF;
  }
  svg {
    stroke-width: .55px;
    width: 45px;
    height: 45px;
    stroke: black;
  }
  div.details {
    margin: 0 25px;
    width: 100%;
  }
  p:nth-child(2) {
    color: rgba(0, 0, 0, 0.5);
  }
  button {
    border-radius: 0 10px 10px 0;
    border: none;
    width: 125px;
    height: 100%;
    display: grid;
    place-items: center;
  }
  button svg {
    width: 30px;
    height: 30px;
    stroke: rgba(0, 0, 0, 0.5);
    stroke-width: 1px;
  }
  button:hover svg.check {
    stroke: #63b9db;
    stroke-width: 2px;
  }
  button:hover svg.cross {
    stroke: #E6C2BF;
    stroke-width: 2px;
  }
</style>