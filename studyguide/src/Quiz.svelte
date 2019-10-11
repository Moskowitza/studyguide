<script>
  import Question from "./Question.svelte";
  let quiz = getQuiz();
  let pickAnswer = a => {
    if (answer === correctAnswer) {
      return (result = "Correct!");
      result = "Oops";
    }
  };
  async function getQuiz() {
    const res = await fetch(
      "https://opentdb.com/api.php?amount=10&category=27&type=multiple"
    );
    const quiz = await res.json();
    return quiz;
  }
  function handleClick() {
    quiz = getQuiz();
  }
</script>

<style>
  h4 {
    color: red;
  }
</style>

<div>
  <button on:click={handleClick}>Get New Questions</button>
  {#await quiz}
    loading
  {:then data}
    {#each data.results as question}
      <Question {question} />
    {/each}
  {/await}

</div>
