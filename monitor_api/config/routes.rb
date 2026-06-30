Rails.application.routes.draw do
  resources :endpoints, only: [:index, :create, :destroy]
  resources :ping_results, only: [:index]

  get "up" => "rails/health#show", as: :rails_health_check
  get "keep-alive" => "rails/health#show" # Endpoint to prevent Render from sleeping
end
