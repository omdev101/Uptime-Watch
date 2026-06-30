require 'net/http'

class PingEndpointJob < ApplicationJob
  queue_as :default

  def perform(endpoint_id)
    endpoint = Endpoint.find_by(id: endpoint_id)
    return unless endpoint

    uri = URI(endpoint.url)
    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    
    status_code = 0
    response_body = nil
    response_headers = nil

    begin
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.open_timeout = 5
      http.read_timeout = 5

      request_class = case (endpoint.http_method || 'GET').upcase
                      when 'POST' then Net::HTTP::Post
                      when 'PUT' then Net::HTTP::Put
                      when 'DELETE' then Net::HTTP::Delete
                      else Net::HTTP::Get
                      end

      request = request_class.new(uri)
      
      # Inject custom headers if present
      if endpoint.respond_to?(:custom_headers) && endpoint.custom_headers.is_a?(Hash)
        endpoint.custom_headers.each do |key, value|
          request[key] = value.to_s
        end
      end

      response = http.request(request)
      status_code = response.code.to_i
      
      # Truncate response body to 10,000 chars to avoid DB bloat
      response_body = response.body.to_s[0...10000]
      response_headers = response.to_hash
    rescue StandardError => e
      status_code = 0 # 0 indicates a failure to connect
      response_body = e.message
    end

    end_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    response_time_ms = ((end_time - start_time) * 1000).round

    PingResult.create!(
      endpoint: endpoint,
      status_code: status_code,
      response_time_ms: response_time_ms,
      response_body: response_body,
      response_headers: response_headers
    )

    # Log to custom file
    logger = Logger.new(Rails.root.join('log', 'ping_responses.log'))
    logger.info("[#{Time.current}] Pinged #{endpoint.url} - Status: #{status_code} - Time: #{response_time_ms}ms")
  end
end
