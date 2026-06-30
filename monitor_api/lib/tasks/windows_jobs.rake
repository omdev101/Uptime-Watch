namespace :jobs do
  desc "Run Solid Queue worker and dispatcher in threads for Windows (bypasses fork)"
  task windows: :environment do
    puts "Starting Solid Queue Dispatcher and Worker in threads (Windows Mode)..."

    # Start the dispatcher in a background thread
    Thread.new do
      Rails.application.executor.wrap do
        dispatcher = SolidQueue::Dispatcher.new(
          polling_interval: 1,
          batch_size: 500
        )
        dispatcher.start
      end
    end

    # Start the worker in another background thread
    Thread.new do
      Rails.application.executor.wrap do
        worker = SolidQueue::Worker.new(
          queues: "*",
          threads: 3,
          polling_interval: 0.1
        )
        worker.start
      end
    end

    # Start the Scheduler in a third background thread
    Thread.new do
      puts "Starting API Monitor Scheduler thread..."
      loop do
        begin
          Rails.application.executor.wrap do
            PingAllEndpointsJob.perform_now
          end
        rescue => e
          puts "Error scheduling endpoints: #{e.message}"
        end
        sleep 10
      end
    end
    
    puts "Workers are running! (Press Ctrl+C to stop)"
    
    # Keep the main thread alive indefinitely so the jobs can run
    loop do
      sleep 1
    end
  end
end
