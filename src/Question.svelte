<script>
  import { score } from "./store.js";

  export let question;
  export let nextQuestion;
  let isCorrect;
  let isAnswered = false;
  export let count = 0;
  let correctAnswer = question.correct_answer;
  let answers = question.incorrect_answers.map(answer => {
    return {
      answer,
      correct: false
    };
  });
  let allAnswers = [...answers, { answer: correctAnswer, correct: true }];

  function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
  }
  shuffle(allAnswers);
  function checkQuestion(ans) {
    isAnswered = true;
    isCorrect = ans;
    if (ans) {
      score.update(val => val + 1);
    }
    count++;
  }
</script>

<style>
  button {
    height: 4em;
    margin: 0.5rem;
    padding: 0.5rem;
  }
  .isCorrect {
    color: green;
  }
  .wrong {
    color: red;
  }
  h5:after {
    content: "\200b";
  }
  .answer_continer {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    max-width: 500px;
  }
</style>

<h3>
  {@html question.question}
</h3>
<h5 class={isCorrect ? 'correct' : 'wrong'}>
  {#if isAnswered}
    {#if isCorrect}You got that one right{:else}WRONG!!!!{/if}
  {/if}
</h5>
<div class="answer_continer">
  {#each allAnswers as answer}
    <button
      class:isCorrect={answer.correct && isAnswered}
      on:click={() => checkQuestion(answer.correct)}>
      {@html answer.answer}
    </button>
  {/each}
  {#if isAnswered}
    <div>
      <button on:click={nextQuestion}>next</button>
    </div>
  {/if}
</div>
