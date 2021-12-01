<script>
  import { fade } from "svelte/transition";
  import { pageIndex } from "../stores/pages";
  import { employeeCurrentIndex, employeeTotalIndexCount } from "../stores/employee";
  import { studentCurrentIndex, studentTotalIndexCount } from "../stores/student";
  import { searchValue, searchIndex, searchResults } from "../stores/search";
  import { selectedProfile, selectedProfileCurrentIndex, selectedProfileIndices } from "../stores/profile";

  let currentIndex, endIndex;
  $: if ($selectedProfile != "") {
    $selectedProfileIndices.then((res) => {
      if (res.count != 0) {
        currentIndex = $selectedProfileCurrentIndex + 1;
      }
      endIndex = res.count;
    });
  } else if ($searchValue != "" && $searchValue.length >= 2) {
    currentIndex = $searchIndex + 1;
    $searchResults.then((res) => {
      endIndex = res.queryIndexCount;
    });
  } else if ($pageIndex == 0) {
    currentIndex = $studentCurrentIndex;
    $studentTotalIndexCount.then((res) => {
      endIndex = res.count;
    });
  } else {
    currentIndex = $employeeCurrentIndex;
    $employeeTotalIndexCount.then((res) => {
      endIndex = res.count;
    });
  }

  let back = () => {
    if ($selectedProfile != "") {
      selectedProfileCurrentIndex.set($selectedProfileCurrentIndex - 1);
      currentIndex = $selectedProfileCurrentIndex - 1;
    }
    else if ($searchValue != "") {
      searchIndex.set($searchIndex - 1);
      currentIndex = $searchIndex - 1;
    }
    else {
      switch ($pageIndex) {
        case 0:
          studentCurrentIndex.set($studentCurrentIndex - 1);
          currentIndex = $studentCurrentIndex;
          break;
        case 1:
          employeeCurrentIndex.set($employeeCurrentIndex - 1);
          currentIndex = $employeeCurrentIndex;
          break;
        }
    }
  }
  let next = () => {
    if ($selectedProfile != "") {
      selectedProfileCurrentIndex.set($selectedProfileCurrentIndex + 1);
      currentIndex = $selectedProfileCurrentIndex + 1;
    }
    else if ($searchValue != "") {
      searchIndex.set($searchIndex + 1);
      currentIndex = $searchIndex + 1;
    } else {
      switch ($pageIndex) {
        case 0:
          studentCurrentIndex.set($studentCurrentIndex + 1);
          currentIndex = $studentCurrentIndex;
          break;
        case 1:
          employeeCurrentIndex.set($employeeCurrentIndex + 1);
          currentIndex = $employeeCurrentIndex;
          break;
        }
    }
  }
</script>

{#await endIndex then value}
  {#if value != 0 && value != null && value != undefined}
    <div in:fade={{ delay: 750, duration: 200 }} out:fade={{ duration: 200 }} class="fixed pl-14 bottom-5 w-full flex justify-center items-center bg-transparent z-20">
      <button disabled={currentIndex <= 1} on:click={back} class="custom-bg-white mx-2 font-light rounded-full py-0.5 px-4">Back</button>
        <p class="custom-bg-white mx-2 font-light rounded-full py-2 px-6">{currentIndex} out of {value}</p>
      <button disabled={currentIndex == value} on:click={next} class="custom-bg-white mx-2 font-light rounded-full py-0.5 px-4">Next</button>
    </div>
  {/if}
{/await}

<style>
  button, p {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
    transition: 150ms ease-in-out;
  }
  button:hover {
    color: #63b9db;
  }
  button:active {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: #63b9db; 
  }
  button:disabled {
    box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.1);
    color: lightgray;
  }
</style>