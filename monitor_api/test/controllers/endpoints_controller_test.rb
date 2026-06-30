require "test_helper"

class EndpointsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get endpoints_index_url
    assert_response :success
  end

  test "should get create" do
    get endpoints_create_url
    assert_response :success
  end

  test "should get destroy" do
    get endpoints_destroy_url
    assert_response :success
  end
end
