<script>
  import { fly, fade } from "svelte/transition";
  import { selectedProfile } from "../stores/profile";
  export let student;

  let selectProfile = () => {
    $selectedProfile = student;
  }
</script>

<div in:fly={{ delay: 500, y: -50, duration: 200 }} out:fade={{ duration: 200 }} class="card grid max-w-3xl mb-3 h-14 w-full rounded-xl items-center z-10">
  <div class=" rounded-l-xl md:w-24 w-20 flex justify-center items-center">
    {#if student.LoggedIn}
      <svg xmlns="http://www.w3.org/2000/svg" class="check h-14 w-full rounded-l-xl custom-bg-blue" style="stroke: black; stroke-width: .25px" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" class="cross h-14 w-full rounded-l-xl custom-bg-red" style="stroke: black; stroke-width: .25px" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    {/if}
  </div>

  <div class="ml-2 overflow-hidden whitespace-nowrap overflow-ellipsis">
    <p class="font-light">{student.Name.Last}, {student.Name.First}</p>
    <p class="font-light text-gray-500">{student.Student.Course} {student.Student.Year}-{student.Student.Section}</p>
  </div>

  <button class="w-16 h-full flex justify-center items-center" on:click={selectProfile}>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 bg-transparent" class:check={student.LoggedIn} class:cross={!student.LoggedIn} fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>

<style>
  div.card {
    grid-template-columns: auto 1fr auto;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  }
  button {
    transition: 150ms ease-in-out;
  }
  button svg {
    transition: 150ms ease-in-out;
  }
  button:hover svg {
    stroke-width: 1.5;
  }
  button svg.check {
    stroke: #63b9db;
  }
  button svg.cross {
    stroke: #e6c2bf;
  }
</style>