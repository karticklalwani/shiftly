defmodule RealtimeWeb.ChatChannel do
  use RealtimeWeb, :channel

  @impl true
  def join("chat:" <> conversation_id, payload, socket) do
    user_id = Map.get(payload, "user_id")
    company_id = Map.get(payload, "company_id")

    cond do
      is_nil(user_id) or user_id == "" ->
        {:error, %{reason: "missing_user_id"}}

      is_nil(company_id) or company_id == "" ->
        {:error, %{reason: "missing_company_id"}}

      conversation_id == "" ->
        {:error, %{reason: "missing_conversation_id"}}

      true ->
        socket =
          socket
          |> assign(:conversation_id, conversation_id)
          |> assign(:user_id, user_id)
          |> assign(:company_id, company_id)

        send(self(), :after_join)

        {:ok,
         %{
           conversation_id: conversation_id,
           user_id: user_id,
           status: "joined"
         }, socket}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    broadcast_from(socket, "user:online", %{
      user_id: socket.assigns.user_id,
      conversation_id: socket.assigns.conversation_id,
      online: true,
      at: DateTime.utc_now() |> DateTime.to_iso8601()
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("message:new", payload, socket) do
    message = %{
      id: Map.get(payload, "id"),
      conversation_id: socket.assigns.conversation_id,
      sender_id: socket.assigns.user_id,
      receiver_id: Map.get(payload, "receiver_id"),
      message: Map.get(payload, "message"),
      created_at:
        Map.get(payload, "created_at") ||
          (DateTime.utc_now() |> DateTime.to_iso8601())
    }

    broadcast(socket, "message:new", message)

    {:reply, {:ok, message}, socket}
  end

  @impl true
  def handle_in("typing:start", _payload, socket) do
    broadcast_from(socket, "typing:start", %{
      conversation_id: socket.assigns.conversation_id,
      user_id: socket.assigns.user_id
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("typing:stop", _payload, socket) do
    broadcast_from(socket, "typing:stop", %{
      conversation_id: socket.assigns.conversation_id,
      user_id: socket.assigns.user_id
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("message:read", payload, socket) do
    event = %{
      conversation_id: socket.assigns.conversation_id,
      user_id: socket.assigns.user_id,
      message_id: Map.get(payload, "message_id"),
      read_at: DateTime.utc_now() |> DateTime.to_iso8601()
    }

    broadcast(socket, "message:read", event)

    {:reply, {:ok, event}, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    broadcast_from(socket, "user:offline", %{
      user_id: socket.assigns[:user_id],
      conversation_id: socket.assigns[:conversation_id],
      online: false,
      at: DateTime.utc_now() |> DateTime.to_iso8601()
    })

    :ok
  end
end