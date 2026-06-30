namespace :monitor do
  desc "Runs a simple Windows-compatible scheduler to ping endpoints every 10 seconds"
  task start_scheduler: :environment do
    puts "Starting API Monitor Scheduler (Windows Native)..."
    
    loop do
      begin
        PingAllEndpointsJob.perform_now
        puts "--> Pinged all endpoints at #{Time.current}"
      rescue => e
        puts "Error pinging endpoints: #{e.message}"
      end
      
      sleep 10
    end
  end
end
