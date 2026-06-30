require "test_helper"

class PingResultsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get ping_results_index_url
    assert_response :success
  end
end
