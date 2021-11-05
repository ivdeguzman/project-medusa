<script>
  import { onDestroy, onMount } from "svelte";
  import EmployeesCard from "../interface/EmployeesCard.svelte";
  export let searchValue;
  let EmployeeData;

  onMount(async () => {
    socket.emit("employeeDataGet");
  });

  onDestroy(() => {
    EmployeeData = undefined;
    searchValue = "";
  });

  socket.on("employeeDataRetriveList", list => {
    EmployeeData = list;
  });

  socket.on("employeeDataInsert", insert => {
    EmployeeData = [...EmployeeData, insert];
  });

  socket.on("employeeDataUpdate", update => {
    EmployeeData.forEach(Employee => {
      if (Employee._id == update._id) {
        Employee.Name.First = update.Name.First;
        Employee.Name.Last = update.Name.Last;
        Employee.Occupation = update.Occupation;
        Employee.LoggedIn = update.LoggedIn;
      }
    });
    EmployeeData = EmployeeData;
  });

  socket.on("employeeDataDelete", deleted => {
    console.log(deleted)
    const updateEmployeeData = EmployeeData.filter(Employee => {
      return Employee._id != deleted;
    });
    EmployeeData = updateEmployeeData;
  });
</script>

<div>
  {#if EmployeeData}
    {#each EmployeeData as Employee (Employee._id)}
      <EmployeesCard {Employee} />
    {/each}
  {:else if EmployeeData == "Error"}
    <p>There is a problem with your request.</p>
  {/if}
</div>

<style>
  div {
    height: auto;
    display: flex;
    justify-content: center;
    flex-flow: row wrap;
  }
</style>