class EndpointsController < ApplicationController
  def index
    # Load endpoints and only attach the most recent 30 ping results to keep the payload size manageable but allow sparklines
    endpoints = Endpoint.all.map do |endpoint|
      endpoint.as_json.merge(
        ping_results: endpoint.ping_results.order(created_at: :asc).last(30)
      )
    end
    render json: endpoints
  end

  def create
    endpoint = Endpoint.new(endpoint_params)
    if endpoint.save
      render json: endpoint, status: :created
    else
      render json: endpoint.errors, status: :unprocessable_entity
    end
  end

  def destroy
    endpoint = Endpoint.find(params[:id])
    endpoint.destroy
    head :no_content
  end

  private

  def endpoint_params
    # custom_headers can be a JSON string from frontend, we should parse it if it's a string, or just permit it if it's a hash
    permitted = params.require(:endpoint).permit(:name, :url, :http_method, :expected_status, :environment)
    
    if params[:endpoint][:custom_headers].present?
      begin
        permitted[:custom_headers] = params[:endpoint][:custom_headers].is_a?(String) ? JSON.parse(params[:endpoint][:custom_headers]) : params[:endpoint][:custom_headers]
      rescue JSON::ParserError
        permitted[:custom_headers] = {}
      end
    end
    
    permitted
  end
end
