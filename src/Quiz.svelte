<script>
  import { fade, blur, fly, slide, scale } from "svelte/transition";
  import { onMount, beforeUpdate, afterUpdate, onDestroy } from "svelte";
  import Question from "./Question.svelte";
  import Modal from "./Modal.svelte";
  import { score } from "./store.js";
  let activeQuestion = 0;
  let quiz = getQuiz();
  let isModalOpen = false;
  onMount(() => {});

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
  function nextQuestion() {
    activeQuestion = activeQuestion + 1;
  }
  function resetQuiz() {
    isModalOpen = false;
    activeQuestion = 0;
    score.set(0);
    quiz = getQuiz();
  }

  $: if ($score > 8) {
    //TODO Switch to an animation
    isModalOpen = true;
  }
  $: questionNumber = activeQuestion + 1;
</script>

<style>
  h4 {
    color: purple;
  }
  .fade-wrapper {
    position: absolute;
  }
  .container {
    min-height: 500px;
  }
</style>

<div>
  <h4>Score: {$score}</h4>
  <h4>Question {questionNumber}</h4>
  <button on:click={resetQuiz}>Start New Quiz</button>
  <div class="container">
    {#await quiz}
      loading
    {:then data}
      {#each data.results as question, index}
        {#if index === activeQuestion}
          <div in:fly={{ x: 200 }} out:fly={{ x: -200 }} class="fade-wrapper">
            <Question {question} {nextQuestion} />
          </div>
        {/if}
      {/each}
    {/await}
  </div>
</div>
{#if isModalOpen}
  <Modal on:close={resetQuiz}>
    <h2>You Won</h2>
    <p>Congratulations NERD!!!</p>
    <button on:click={resetQuiz}>Start Over</button>
  </Modal>
{/if}
