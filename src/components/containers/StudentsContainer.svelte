<script>
  import { onDestroy, onMount } from "svelte";
  import StudentsCard from "../interface/StudentsCard.svelte";
  export let searchValue;
  let StudentData;

  onMount(async () => {
    socket.emit("studentDataGet");
  });

  onDestroy(() => {
    StudentData = undefined;
    searchValue = "";
  });

  socket.on("studentDataRetriveList", list => {
    StudentData = list;
  });

  socket.on("studentDataInsert", insert => {
    StudentData = [...StudentData, insert];
  });

  socket.on("studentDataUpdate", update => {
    StudentData.forEach(Student => {
      if (Student._id == update._id) {
        Student.Name.First = update.Name.First;
        Student.Name.Last = update.Name.Last;
        Student.Student.Course = update.Student.Course;
        Student.Student.Year = update.Student.Year;
        Student.Student.Section = update.Student.Section;
        Student.LoggedIn = update.LoggedIn;
      }
    });
    StudentData = StudentData;
  });

  socket.on("studentDataDelete", deleted => {
    const updateStudentData = StudentData.filter(Student => {
      return Student._id != deleted;
    })
    StudentData = updateStudentData;
  })
</script>

<div>
  {#if StudentData}
    {#each StudentData as Student (Student._id)}
      <StudentsCard {Student} />
    {/each}
  {:else if StudentData == "Error"}
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