defmodule RealtimeWeb.UserSocket do
  use Phoenix.Socket

  channel "chat:*", RealtimeWeb.ChatChannel

  @impl true
  def connect(params, socket, _connect_info) do
    user_id = Map.get(params, "user_id")
    company_id = Map.get(params, "company_id")

    cond do
      is_nil(user_id) or user_id == "" ->
        :error

      is_nil(company_id) or company_id == "" ->
        :error

      true ->
        socket =
          socket
          |> assign(:user_id, user_id)
          |> assign(:company_id, company_id)

        {:ok, socket}
    end
  end

  @impl true
  def id(socket) do
    "user_socket:#{socket.assigns.user_id}"
  end
end