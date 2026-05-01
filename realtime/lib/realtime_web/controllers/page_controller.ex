defmodule RealtimeWeb.PageController do
  use RealtimeWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
