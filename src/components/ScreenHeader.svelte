<script>
  import Icon from '../lib/Icon.svelte'
  let { eyebrow, title, go, back = null, right = null } = $props()
</script>

<div class="row" style="justify-content: space-between; margin: 4px 2px 18px;">
  <div>
    {#if eyebrow}
      <div class="faint hd-eyebrow">{eyebrow}</div>
    {/if}
    <h1 class="hd-title">{title}</h1>
  </div>
  <div class="row" style="gap: 8px;">
    {#if right}
      {@render right()}
    {/if}
    <button
      class="hd-btn"
      aria-label={back ? 'back' : 'settings'}
      onclick={() => go(back || 'settings')}
    >
      <Icon name={back ? 'arrow' : 'sliders'} size={20} style={back ? 'transform: rotate(180deg)' : ''} />
    </button>
  </div>
</div>
