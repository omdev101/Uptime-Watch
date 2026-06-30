class PingResultsController < ApplicationController
  def index
    @ping_results = PingResult.order(created_at: :desc).limit(100)
    render json: @ping_results
  end
end
