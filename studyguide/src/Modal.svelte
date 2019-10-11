<script>
  import { fly, fade } from "svelte/transition";
  import { createEventDispatcher } from "svelte";
  let w; //This will grab dom attribtues right from the client
  const dispatch = createEventDispatcher();
</script>

<style lang="scss">
  .modal-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    .modal {
      background: white;
      padding: 20px;
      border-radius: 15px;
    }
  }
</style>

<div class="modal-bg" tansition:fade bind:clientWidth={w}>
  <div class="modal" transition:fly={{ y: 200 }}>
    <button
      on:click={() => {
        dispatch('close');
      }}>
      close
    </button>
    <slot />
  </div>
</div>
