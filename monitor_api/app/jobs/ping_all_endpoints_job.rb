class PingAllEndpointsJob < ApplicationJob
  queue_as :default

  def perform
    Endpoint.find_each do |endpoint|
      PingEndpointJob.perform_later(endpoint.id)
    end
  end
end
