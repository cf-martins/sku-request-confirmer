<script lang="ts">
  import {
    CircleCheckIcon,
    CircleXIcon,
    FileJson2Icon,
    PlusCircleIcon,
    ScanBarcodeIcon,
    XCircleIcon,
    XIcon,
  } from "lucide-svelte";

  let apiUrl = $state(
    "https://clouddev.maisinteligencia.com.br/EVA_PRODUCT/APP/EHA/api/v1/EVA/SkuRequestConfirm",
  );
  let accessToken = $state("");
  let skuRequests = $state([""]);
  interface Response {
    id: string | number;
    status?: number;
    body?: string;
    success: boolean;
    index: number;
    error?: string;
  }
  let responses = $state<Response[]>([]);
  let errors = $state<string[]>([]);
  let autoloadUrl = $state(
    "https://clouddev.maisinteligencia.com.br/EVA_PRODUCT/APP/EDA/api/EDA/GetSkuRequests",
  );
  let isLoadingRequests = $state(false);

  const addRequest = () => skuRequests.unshift("");

  const removeRequest = (index: number) => {
    if (skuRequests.length > 1) {
      skuRequests = skuRequests.filter((_, i) => i !== index);
    }
  };

  const submitRequests = async () => {
    errors = [];
    responses = [];

    let hasErrors = false;
    skuRequests.forEach((request, index) => {
      if (!request.trim()) {
        errors.push(`Request #${index + 1} is empty`);
        hasErrors = true;
      }
    });
    if (hasErrors) return;

    for (const [index, requestJson] of skuRequests.entries()) {
      try {
        const requestData = JSON.parse(requestJson);

        const payload = {
          ...requestData,
          response_request_ID: requestData.request_ID,
          response_sku_qty: requestData.request_sku_qty,
          response_sku_lot: requestData.request_sku_unique_code,
          response_error: 0,
        };

        try {
          const response = await fetch("/api/proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "Target-URL": apiUrl,
            },
            body: JSON.stringify(payload),
          });

          const responseBody = await response.text();
          responses.push({
            id: requestData.request_ID,
            status: response.status,
            body: responseBody,
            success: response.ok,
            index,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          responses.push({
            id: requestData.request_ID,
            error: errorMessage,
            success: false,
            index,
          });
        }
      } catch (err) {
        responses.push({
          id: `Request #${index + 1}`,
          error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
          success: false,
          index,
        });
      }
    }
  };

  const loadRequests = async () => {
    isLoadingRequests = true;
    try {
      const response = await fetch(`/api/proxy?timestamp=${Date.now()}`, {
        method: "GET",
        headers: {
          "Target-URL": autoloadUrl,
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      skuRequests = data.skuRequests.map((request: any) =>
        JSON.stringify(
          {
            request_sku_unique_code: request.skuUniqueCode,
            request_sku_qty: request.skuQty,
            request_sku_operation: request.skuOperation,
            request_sku_position: request.skuPositionOrigin,
            request_unique_lot: request.uniqueLot,
            request_ID: request.id,
            response_request_ID: request.responseRequestId,
            response_sku_qty: request.responseSkuQty,
            response_sku_lot: request.responseSkuLot,
            response_container: request.responseContainer,
            response_message: request.responseMessage,
            response_error: request.responseError,
          },
          null,
          2,
        ),
      );

      errors = [];
    } catch (err) {
      errors = [
        `Failed to load requests: ${err instanceof Error ? err.message : "Unknown error"}`,
      ];
    }
    isLoadingRequests = false;
  };
</script>

<main class="mx-auto max-w-4xl space-y-6 p-6">
  <div class="flex w-fit items-center gap-2 rounded-box select-none">
    <ScanBarcodeIcon class="size-6 text-primary" />
    <h1 class="text-2xl font-bold">SKU Request Confirm</h1>
  </div>
  {#if errors.length > 0}
    <div class="space-y-2">
      {#each errors as error}
        <div
          role="alert"
          class="alert-soft alert alert-error"
        >
          <CircleXIcon class="size-5" />
          {error}
        </div>
      {/each}
    </div>
  {/if}
  <fieldset
    class="fieldset rounded-box border border-base-content/10 bg-base-200 p-4"
  >
    <legend class="fieldset-legend">Settings</legend>
    <label
      for="api-url"
      class="fieldset-label text-sm font-medium"
    >
      API Endpoint URL
    </label>
    <input
      id="api-url"
      type="url"
      bind:value={apiUrl}
      placeholder="Enter API endpoint URL"
      class="input w-full"
    />
    <label
      for="autoload-url"
      class="fieldset-label text-sm font-medium"
    >
      Autoload URL
    </label>
    <input
      id="autoload-url"
      type="url"
      bind:value={autoloadUrl}
      placeholder="Enter autoload endpoint URL"
      class="input w-full"
    />
    <label
      for="access-token"
      class="fieldset-label text-sm font-medium"
    >
      Access token
    </label>
    <input
      id="access-token"
      type="text"
      bind:value={accessToken}
      placeholder="Enter access token"
      class="input w-full"
    />
  </fieldset>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <FileJson2Icon class="size-5" />
      <h2 class="text-lg font-medium">Requests</h2>
      <div class="ml-auto flex gap-2">
        <button
          onclick={loadRequests}
          disabled={isLoadingRequests}
          class="btn btn-sm btn-secondary"
        >
          {#if isLoadingRequests}
            <span class="loading loading-xs loading-spinner"></span>
            Loading
          {:else}
            Autoload requests
          {/if}
        </button>
        <button
          onclick={addRequest}
          class="btn btn-sm btn-success"
        >
          <PlusCircleIcon class="size-4" />
          Add request
        </button>
      </div>
    </div>
    <button
      onclick={submitRequests}
      class="btn btn-block btn-primary"
    >
      Submit all requests
    </button>
    {#each skuRequests, index (index)}
      <div class="space-y-3 rounded-box border border-base-content/10 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">
            Request #{index + 1}
          </span>
          {#if skuRequests.length > 1}
            <button
              onclick={() => removeRequest(index)}
              class="btn btn-xs btn-error btn-soft"
            >
              <XIcon class="size-3" />
              Remove
            </button>
          {/if}
        </div>
        <textarea
          bind:value={skuRequests[index]}
          rows="4"
          class="textarea w-full font-mono focus:textarea-primary"
          placeholder={`{\n  "request_ID": "123",\n  "request_sku_qty": 5,\n  ...\n}`}
        ></textarea>
        {#if responses.find((r) => r.index === index)?.error}
          <div class="text-sm text-error">
            Error: {responses.find((r) => r.index === index)?.error}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  {#if responses.length > 0}
    <div class="space-y-4">
      <h2 class="text-lg font-medium">Responses</h2>
      {#each responses as response}
        {@const hasError = response.error || !response.success}
        <div
          role="alert"
          class={`alert-soft alert alert-vertical sm:alert-horizontal ${hasError ? "alert-error" : "alert-success"}`}
        >
          {#if hasError}
            <XCircleIcon class="size-5" />
          {:else}
            <CircleCheckIcon class="size-5" />
          {/if}
          <div>
            <h3 class="font-bold">
              {response.id}
              {response.success ? "(Success)" : "(Failed)"}
            </h3>
            {#if response.error}
              <div>{response.error}</div>
            {:else}
              <div>HTTP Status: {response.status}</div>
              {#if response.body}
                <div class="mt-1 font-mono text-xs">
                  Response: {response.body}
                </div>
              {/if}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</main>
